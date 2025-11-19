import logging
logger = logging.getLogger(__name__)
from django.views.decorators.csrf import csrf_exempt
from .models import Link, EmailOTP
from .verdicts_client import score_url
import hashlib, json, html, secrets
import requests
from datetime import timedelta
from django.http import JsonResponse, HttpResponse, HttpResponseNotAllowed, HttpResponseNotFound, HttpResponseForbidden
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.core.mail import send_mail


def _json(request):
    try:
        return json.loads(request.body.decode() or "{}")
    except Exception:
        return {}


def _short_url(link_id: str) -> str:
    base = (getattr(settings, "SITE_BASE_URL", "http://127.0.0.1:8000") or "").rstrip("/")
    return f"{base}/r/{link_id}"


def _target_alive(url: str, timeout: float = 4.0):
    try:
        for method in ("HEAD", "GET"):
            resp = requests.request(method, url, timeout=timeout, allow_redirects=True)
            status = resp.status_code
            if 200 <= status < 400:
                return True, None
            if status in (404, 410):
                return False, f"http_status_{status}"
        return True, None
    except requests.RequestException as exc:
        return False, exc.__class__.__name__


@csrf_exempt
def create_link(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    data = _json(request)
    target = data.get("target")
    if not target:
        return JsonResponse({"error":"target required"}, status=400)
    ok, reason = _target_alive(target)
    if not ok:
        return JsonResponse({
            "error": "target_unreachable",
            "message": "Destination site could not be reached.",
            "detail": reason,
        }, status=400)

    link = Link(
        target=target,
        analytics_opt_in=bool(data.get("analytics_opt_in", False)),
        require_password=bool(data.get("require_password", False)),
    )
    pw = data.get("password")
    if pw:
        link.password_hash = hashlib.sha256(pw.encode()).hexdigest()
    expires = data.get("expires_at")
    if expires:
        dt = parse_datetime(expires)
        link.expires_at = dt
    link.save()
    return JsonResponse({"id": link.id, "target": link.target, "short_url": _short_url(link.id)})


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_link(request, link_id):
    try:
        link = Link.objects.get(pk=link_id, owner=request.user)  # ⬅ enforce ownership
    except Link.DoesNotExist:
        return Response(status=404)
    return Response({
        "id": link.id,
        "target": link.target,
        "expires_at": link.expires_at,
        "analytics_opt_in": link.analytics_opt_in,
        "require_password": link.require_password,
        "has_password": bool(link.password_hash),
        "short_url": _short_url(link.id),
    })


@api_view(["PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_link(request, link_id):
    try:
        link = Link.objects.get(pk=link_id, owner=request.user)  # ⬅ enforce ownership
    except Link.DoesNotExist:
        return Response(status=404)

    data = request.data
    if "require_password" in data:
        link.require_password = bool(data["require_password"])
    if "password" in data:
        pw = data["password"]
        link.password_hash = None if not pw else hashlib.sha256(pw.encode()).hexdigest()
    if "expires_at" in data:
        link.expires_at = parse_datetime(data["expires_at"]) if data["expires_at"] else None
    if "analytics_opt_in" in data:
        link.analytics_opt_in = bool(data["analytics_opt_in"])

    link.save()
    return Response({"ok": True})


@api_view(["DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_link(request, link_id):
    try:
        link = Link.objects.get(pk=link_id, owner=request.user)  # ⬅ enforce ownership
    except Link.DoesNotExist:
        return Response(status=404)
    link.delete()
    return Response({"ok": True})

@api_view(["GET"])
@permission_classes([AllowAny])
def preview_link(request, link_id):
    try:
        link = Link.objects.get(pk=link_id)
    except Link.DoesNotExist:
        return HttpResponseNotFound()
    # Placeholder preview payload
    return JsonResponse({"id": link.id, "preview": {"title": "Preview placeholder", "target": link.target}})



from django.shortcuts import redirect
from django.utils import timezone
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseBadRequest
import html

def _check_expired(link):
    return link.expires_at and link.expires_at <= timezone.now()

def _pw_ok(link, provided):
    if not link.password_hash:
        return True
    import hashlib
    if not provided:
        return False
    return hashlib.sha256(provided.encode()).hexdigest() == link.password_hash

@api_view(["GET"])
@permission_classes([AllowAny])
def preview_gate(request, link_id):
    # HTML preview with security verdict + optional password prompt
    try:
        link = Link.objects.get(pk=link_id)
    except Link.DoesNotExist:
        return HttpResponseNotFound("Link not found")

    if _check_expired(link):
        return HttpResponseForbidden("Link expired")

    # Call model service for verdict
    verdict = score_url(link.target)  # {url,label,p,reasons}
    label = verdict.get("label", "safe")
    reasons = verdict.get("reasons", []) or []
    prob = verdict.get("p", 0.0)

    badge_txt = {"safe": "✅ Safe", "warning": "⚠️ Warning", "blocked": "⛔ Blocked"}.get(label, "✅ Safe")
    badge_color = {"safe": "#16a34a", "warning": "#f59e0b", "blocked": "#dc2626"}.get(label, "#16a34a")

    # Only show password field if it's actually required
    needs_pw = bool(link.password_hash) and bool(link.require_password)

    target = html.escape(link.target)
    reasons_html = ", ".join(html.escape(r) for r in reasons) or "none"

    # If blocked, disable continue entirely
    continue_html = ""
    if label == "blocked":
        continue_html = '<p style="color:#dc2626;font-weight:600;">This destination is blocked by security policy.</p>'
    else:
        if needs_pw:
            continue_html = (
                f'<p>This link is password protected.</p>'
                f'<form method="GET" action="/r/{link_id}">'
                f'<input name="pw" placeholder="Password" style="padding:8px;margin-right:8px;">'
                f'<button type="submit" style="padding:8px 12px;">Continue</button>'
                f'</form>'
            )
        else:
            continue_html = f'<a href="/r/{link_id}"><button style="padding:8px 12px;">Continue</button></a>'
    _log_event(link, "preview", verdict, request, success=False)
    return HttpResponse(f"""
    <!doctype html><meta charset="utf-8">
    <title>PeekLink preview</title>
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial;margin:24px;max-width:720px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <span style="display:inline-block;background:{badge_color};color:white;padding:6px 10px;border-radius:8px;font-weight:600;">
          {badge_txt}
        </span>
        <small style="opacity:.7;">score={prob:.2f}</small>
      </div>

      <h3 style="margin:8px 0 4px;">You're previewing:</h3>
      <p><code style="word-break:break-all">{target}</code></p>

      <details style="margin:8px 0 16px;">
        <summary>Why this verdict?</summary>
        <p style="margin-top:8px;">{reasons_html}</p>
      </details>

      {continue_html}
    </div>
    """, content_type="text/html")


@api_view(["GET"])
@permission_classes([AllowAny])
def resolve_redirect(request, link_id):
    try:
        link = Link.objects.get(pk=link_id)
    except Link.DoesNotExist:
        return HttpResponseNotFound("Link not found")

    if _check_expired(link):
        return HttpResponseForbidden("Link expired")

    # Security verdict gate: block if model says "blocked"
    v = score_url(link.target)
    if v.get("label") == "blocked":
        _log_event(link, "redirect", v, request, success=False)
        why = ", ".join(v.get("reasons", [])) or "policy"
        return HttpResponseForbidden(f"Blocked by security policy ({why})")

    # if v.get("label") == "blocked":
    #     why = ", ".join(v.get("reasons", [])) or "policy"
    #     return HttpResponseForbidden(f"Blocked by security policy ({why})")

    # Enforce password only if required AND present
    if link.require_password and link.password_hash:
        pw = request.GET.get("pw") or ""
        if not _pw_ok(link, pw):
            return HttpResponseForbidden("Password required or incorrect")

    # For "warning", we still allow (preview already showed caution)
    _log_event(link, "redirect", v, request, success=True)
    return redirect(link.target)







# @csrf_exempt
# def update_link(request, link_id):
#     if request.method != "PATCH":
#         return HttpResponseNotAllowed(["PATCH"])
#     try:
#         link = Link.objects.get(pk=link_id)
#     except Link.DoesNotExist:
#         return HttpResponseNotFound()

#     data = _json(request)

#     # toggle require_password
#     if "require_password" in data:
#         link.require_password = bool(data["require_password"])

#     # set or clear password
#     if "password" in data:
#         pw = data["password"]
#         if pw is None or pw == "":
#             link.password_hash = None
#         else:
#             link.password_hash = hashlib.sha256(pw.encode()).hexdigest()

#     # optional updates
#     if "expires_at" in data:
#         from django.utils.dateparse import parse_datetime
#         link.expires_at = parse_datetime(data["expires_at"]) if data["expires_at"] else None
#     if "analytics_opt_in" in data:
#         link.analytics_opt_in = bool(data["analytics_opt_in"])

#     link.save()
#     return JsonResponse({"ok": True})


from django.db.models import Count
from django.utils import timezone

def _ua_hash(request):
    ua = request.META.get("HTTP_USER_AGENT", "")
    return hashlib.sha256(ua.encode()).hexdigest() if ua else ""

def _referrer(request):
    return request.META.get("HTTP_REFERER", "")[:256]

def _log_event(link, event, verdict, request, success=True):
    if not link.analytics_opt_in:
        return
    from .models import ClickEvent
    ClickEvent.objects.create(
        link=link,
        event=event,
        verdict_label=verdict.get("label", "safe"),
        verdict_score=float(verdict.get("p", 0.0) or 0.0),
        referrer=_normalize_referrer(_referrer(request)),
        ua_hash=_ua_hash(request),
        success=success,
    )


@api_view(["GET", "POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def links_collection(request):
    if request.method == "POST":
        data = request.data
        target = data.get("target")
        if not target:
            return Response({"error": "target required"}, status=400)
        ok, reason = _target_alive(target)
        if not ok:
            return Response({
                "error": "target_unreachable",
                "message": "Destination site could not be reached.",
                "detail": reason,
            }, status=400)

        link = Link(
            owner=request.user,  # ⬅ tie to creator
            target=target,
            analytics_opt_in=bool(data.get("analytics_opt_in", False)),
            require_password=bool(data.get("require_password", False)),
        )
        pw = data.get("password")
        if pw:
            link.password_hash = hashlib.sha256(pw.encode()).hexdigest()
        expires = data.get("expires_at")
        if expires:
            dt = parse_datetime(expires)
            link.expires_at = dt
        link.save()
        return Response({"id": link.id, "target": link.target, "short_url": _short_url(link.id)})

    # GET list (owner-only)
    qs = Link.objects.filter(owner=request.user).order_by("-created_at")
    rows = qs.annotate(clicks=Count("events")).values(
        "id", "target", "created_at", "analytics_opt_in", "require_password", "clicks"
    )
    out = [{
        "id": r["id"],
        "target": r["target"],
        "created_at": r["created_at"],
        "analytics_opt_in": r["analytics_opt_in"],
        "require_password": r["require_password"],
        "clicks": r["clicks"],
        "short_url": _short_url(r["id"]),
    } for r in rows]
    return Response(out)
from django.db.models.functions import TruncDate

def _range_qs(request, link_id=None):
    from_str, to_str = request.GET.get("from"), request.GET.get("to")
    frm = parse_datetime(from_str) if from_str else None
    to  = parse_datetime(to_str) if to_str else None
    only = request.GET.get("only", "redirect")

    from .models import ClickEvent, Link
    if link_id:
        try:
            link = Link.objects.get(pk=link_id, owner=request.user)
            qs = link.events.all()
        except Link.DoesNotExist:
            return ClickEvent.objects.none()
    else:
        # all events for this owner
        qs = ClickEvent.objects.filter(link__owner=request.user)

    if only:
        qs = qs.filter(event=only)
    if frm: qs = qs.filter(ts__gte=frm)
    if to:  qs = qs.filter(ts__lte=to)
    return qs

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def analytics_summary(request):
    qs = _range_qs(request, request.GET.get("link_id"))
    total = qs.count()
    blocked = qs.filter(verdict_label="blocked").count()
    warning = qs.filter(verdict_label="warning").count()
    safe = total - blocked - warning
    return Response({"clicks": total, "blocked": blocked, "warning": warning, "safe": safe})


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def analytics_by_day(request):
    qs = _range_qs(request, request.GET.get("link_id"))
    agg = (qs.annotate(day=TruncDate("ts"))
             .values("day")
             .annotate(clicks=Count("id"))
             .order_by("day"))
    return Response(list(agg))


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def analytics_verdict_breakdown(request):
    qs = _range_qs(request, request.GET.get("link_id"))
    agg = (qs.values("verdict_label")
             .annotate(count=Count("id"))
             .order_by("-count"))
    return Response([{"label": a["verdict_label"], "count": a["count"]} for a in agg])


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def analytics_top_referrers(request):
    limit = int(request.GET.get("limit","10"))
    qs = _range_qs(request, request.GET.get("link_id"))
    agg = (qs.values("referrer")
             .annotate(clicks=Count("id"))
             .order_by("-clicks")[:limit])
    return Response(list(agg))


import urllib.parse

def _normalize_referrer(value: str) -> str:
    if not value:
        return "direct"
    try:
        host = urllib.parse.urlparse(value).netloc
        # classify your own preview as ‘peeklink’
        if host.startswith("127.0.0.1") or host.endswith("your-domain.com"):
            return "peeklink"
        return host or "direct"
    except Exception:
        return "direct"

OTP_TTL_MINUTES = 10


def _issue_otp(user):
    code = "".join(secrets.choice("0123456789") for _ in range(6))
    EmailOTP.objects.filter(user=user, verified=False).delete()
    expires = timezone.now() + timedelta(minutes=OTP_TTL_MINUTES)
    EmailOTP.objects.create(user=user, code=code, expires_at=expires)
    try:
        send_mail(
            subject="PeekLink verification code",
            message=f"Your PeekLink verification code is {code}. It expires in {OTP_TTL_MINUTES} minutes.",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "peeklink@example.com"),
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.exception("Failed to send OTP email to %s", user.email)
        return False, str(exc)
    return True, None


User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""
    email = (request.data.get("email") or "").strip().lower()
    if not username or not password or not email:
        return Response({"error": "username_email_password_required"}, status=400)
    if len(password) < 6:
        return Response({"error": "password_too_short"}, status=400)
    if User.objects.filter(email__iexact=email).exists():
        return Response({"error": "email_taken"}, status=400)
    try:
        user = User.objects.create_user(username=username, password=password, email=email, is_active=False)
    except IntegrityError:
        return Response({"error": "username_taken"}, status=400)
    ok, err = _issue_otp(user)
    if not ok:
        return Response({"error": "email_send_failed", "detail": err}, status=500)
    return Response({"ok": True, "message": "Verification code sent"}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def request_otp(request):
    email = (request.data.get("email") or "").strip().lower()
    if not email:
        return Response({"error": "email_required"}, status=400)
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({"error": "unknown_email"}, status=404)
    ok, err = _issue_otp(user)
    if not ok:
        return Response({"error": "email_send_failed", "detail": err}, status=500)
    return Response({"ok": True})


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    email = (request.data.get("email") or "").strip().lower()
    code = (request.data.get("code") or "").strip()
    if not email or not code:
        return Response({"error": "email_code_required"}, status=400)
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({"error": "unknown_email"}, status=404)
    otp = EmailOTP.objects.filter(user=user, code=code, expires_at__gte=timezone.now()).first()
    if not otp:
        return Response({"error": "invalid_or_expired_code"}, status=400)
    otp.verified = True
    otp.save(update_fields=["verified"])
    user.is_active = True
    user.save(update_fields=["is_active"])
    EmailOTP.objects.filter(user=user).exclude(id=otp.id).delete()
    return Response({"ok": True})

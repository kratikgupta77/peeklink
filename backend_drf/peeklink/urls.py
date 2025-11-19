from django.contrib import admin
from django.urls import path
from app import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Auth (JWT)
    path("api/auth/token",   TokenObtainPairView.as_view(),   name="token_obtain_pair"),
    path("api/auth/refresh", TokenRefreshView.as_view(),      name="token_refresh"),
    path("api/auth/signup",  views.signup,                    name="signup"),
    path("api/auth/request-otp", views.request_otp,           name="request_otp"),
    path("api/auth/verify-otp",  views.verify_otp,            name="verify_otp"),

    # Links
    path("api/links", views.links_collection),                       # GET, POST (owner-scoped)
    path("api/links/create", views.create_link),                    # POST (public, for extensions)
    path("api/links/<str:link_id>", views.get_link),                 # GET (owner-scoped)
    path("api/links/<str:link_id>/settings", views.update_link),     # PATCH (owner-scoped)
    path("api/links/<str:link_id>/delete", views.delete_link),       # DELETE (owner-scoped)

    # Analytics (owner-scoped)
    path("api/analytics/summary", views.analytics_summary),
    path("api/analytics/by-day", views.analytics_by_day),
    path("api/analytics/verdict-breakdown", views.analytics_verdict_breakdown),
    path("api/analytics/top-referrers", views.analytics_top_referrers),

    # Public preview/redirect
    path("p/<str:link_id>", views.preview_gate),   # public
    path("r/<str:link_id>", views.resolve_redirect),  # public
]

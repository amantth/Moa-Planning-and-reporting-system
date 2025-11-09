"""
URL configuration for the plans app using Django REST Framework.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
try:
    from rest_framework_nested import routers
    NESTED_AVAILABLE = True
except Exception:
    routers = None
    NESTED_AVAILABLE = False

from .views.dashboard import DashboardViewSet
from .views.units import UnitViewSet
from .views.indicators import IndicatorViewSet
from .views.annual_plans import AnnualPlanViewSet, AnnualPlanTargetViewSet
from .views.quarterly_reports import QuarterlyReportViewSet, QuarterlyIndicatorEntryViewSet
from .views.audit import AuditViewSet
from .views.import_export import ImportExportViewSet
from .views.auth import LoginView, RegistrationView, LogoutView

app_name = 'plans'

# Create the main router
router = DefaultRouter()

# Register main viewsets
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'units', UnitViewSet, basename='units')
router.register(r'indicators', IndicatorViewSet, basename='indicators')
router.register(r'annual-plans', AnnualPlanViewSet, basename='annual-plans')
router.register(r'annual-plan-targets', AnnualPlanTargetViewSet, basename='annual-plan-targets')
router.register(r'quarterly-reports', QuarterlyReportViewSet, basename='quarterly-reports')
router.register(r'quarterly-entries', QuarterlyIndicatorEntryViewSet, basename='quarterly-entries')
router.register(r'audit', AuditViewSet, basename='audit')
router.register(r'import-export', ImportExportViewSet, basename='import-export')

# Create nested routers only if rest_framework_nested is available. If not,
# provide empty url lists so the rest of the app can still start.
if NESTED_AVAILABLE:
    units_router = routers.NestedDefaultRouter(router, r'units', lookup='unit')
    units_router.register(r'indicators', IndicatorViewSet, basename='unit-indicators')
    units_router.register(r'annual-plans', AnnualPlanViewSet, basename='unit-annual-plans')
    units_router.register(r'quarterly-reports', QuarterlyReportViewSet, basename='unit-quarterly-reports')

    annual_plans_router = routers.NestedDefaultRouter(router, r'annual-plans', lookup='annual_plan')
    annual_plans_router.register(r'targets', AnnualPlanTargetViewSet, basename='annual-plan-targets')

    quarterly_reports_router = routers.NestedDefaultRouter(router, r'quarterly-reports', lookup='quarterly_report')
    quarterly_reports_router.register(r'entries', QuarterlyIndicatorEntryViewSet, basename='quarterly-report-entries')
else:
    units_router = None
    annual_plans_router = None
    quarterly_reports_router = None

# Auth endpoints — use path instead of router
auth_urlpatterns = [
    path('auth/register/', RegistrationView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
]

# Combine all URLs. If nested routers are unavailable, skip their URLs.
urlpatterns = auth_urlpatterns + router.urls
if units_router is not None:
    urlpatterns += units_router.urls
if annual_plans_router is not None:
    urlpatterns += annual_plans_router.urls
if quarterly_reports_router is not None:
    urlpatterns += quarterly_reports_router.urls

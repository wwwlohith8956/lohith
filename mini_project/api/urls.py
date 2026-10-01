from django.urls import path
from .views import product_list_create, product_detail

urlpatterns = [
    # GET (list) & POST (create)
    path('products/', product_list_create, name='product-list-create'),
    
    # GET (single item), PUT (full update), PATCH (partial update), DELETE (remove)
    path('products/<int:pk>/', product_detail, name='product-detail'),
]
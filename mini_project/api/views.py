from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication

from home.models import Product
from .serializers import ProductSerializer


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Custom authentication class to bypass CSRF checks during simple REST API testing.
    """
    def enforce_csrf(self, request):
        return


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@authentication_classes([CsrfExemptSessionAuthentication])
def product_list_create(request):
    """
    Basic REST Representation:
    - GET  /api/products/     -> Retrieve list of all products (200 OK)
    - POST /api/products/     -> Create a new product (201 Created)
    """
    # 🔵 GET: Retrieve all products
    if request.method == 'GET':
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response({
            "message": "Fetched all products successfully",
            "count": products.count(),
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # 🟢 POST: Create a new product
    elif request.method == 'POST':
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Product created successfully",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            "message": "Product creation failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
@authentication_classes([CsrfExemptSessionAuthentication])
def product_detail(request, pk):
    """
    Basic REST Representation for a single item:
    - GET    /api/products/<id>/  -> Fetch product details by ID (200 OK)
    - PUT    /api/products/<id>/  -> Full update of product (200 OK)
    - PATCH  /api/products/<id>/  -> Partial update of product fields (200 OK)
    - DELETE /api/products/<id>/  -> Delete product by ID (204 No Content)
    """
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({
            "message": f"Product with ID {pk} does not exist",
            "error": "Not Found"
        }, status=status.HTTP_404_NOT_FOUND)

    # 🔵 GET: Retrieve single product details
    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response({
            "message": f"Fetched details for product ID {pk}",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # 🟡 PUT: Full update (All required fields must be supplied)
    elif request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": f"Product ID {pk} fully updated (PUT)",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response({
            "message": "PUT update failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    # 🟣 PATCH: Partial update (Only passed fields will be updated)
    elif request.method == 'PATCH':
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": f"Product ID {pk} partially updated (PATCH)",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response({
            "message": "PATCH update failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    # 🔴 DELETE: Remove product
    elif request.method == 'DELETE':
        product.delete()
        return Response({
            "message": f"Product ID {pk} deleted successfully (DELETE)"
        }, status=status.HTTP_200_OK)  # We return 200 with confirmation message or 204
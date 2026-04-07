Entities:

User
Product
Order
Review
SellerRating
Dispute

Relationships:

User 1..* Product (seller)

Order 1..* OrderItem

Product 1..* Review

Seller 1..* SellerRating

Order -> Dispute
# consagous

1. clone the project from repo
git clone https://github.com/adarshsrivastav375/consagous.git

2. npm install
3. create .env file and paste the example.env in it

4. run the project
npm run dev

------Api Routes-------
base_url = http://localhost:8007/api

each list api has pagenation and default sorting mechanism on createdAt but cn be modified by filters
 here is default query object, pass the value in query for the desired response
 const {
        endDate,
        page = 1,
        startDate,
        searchkey,
        limit = 10,
        search = "",
        sortdir = "desc",
        sortkey = "createdAt",
      } = filters;


# roles
## get  pagenated role list
base_url/role   reqest = get

## get role by id
base_url/role/:id   reqest = get
## delete
base_url/role/:id   reqest = delete
## create
base_url/role   reqest = post
## update
base_url/role/:id   reqest = put

# user

## login with google auth
base_url/login/:provider 
eg. base_url/login/google  (directly open in th e browser window)
## get  role based user list
 base_url/user/public-role/:role?
## get current user
base_url/user/get-current-user 
## get by id
base_url/user/:id   request = get
## update by id
base_url/user/:id   request = put

# product

## get product list
base_url/product    request = get
## get available product list
base_url/product?status=unavailable
## get product by id
base_url/product/:id    request = get
## update product
base_url/product/:id    request = put
## delete product
base_url/product/:id    request = delete

## note ---
product category can be separated from separate document  (crud is created but not using because of lack of time) for the separation of concern and data integrety.
# Cart
## get users cart details
base_url/cart/details   request = get
## add product to cart 
base_url/cart/:productId    request = post
## remove product to cart
base_url/cart/:productId     request = put
## empty cart
base_url/cart      request = delete


# Order
## get all orders list
base_url/order     request = get
## get user orders
base_url/order/orders    request = get
## best selling products in last 7 days
base_url/order/getBestSellingProducts     request = get
## order list and monthly summary
base_url/order/monthlySummary   request = get
## post an order
base_url/order       request = post
## sales data 
base_url/order/getSalesData   request = get

## update an order
base_url/order/:id  request = put

## delete an order 

base_url/order/:id  request = delete 

 repo link: https://github.com/adarshsrivastav375/consagous.git

# contact 
 ### for any query and suggestions 
 contact at: adarshsrivastav375@gmail.com
 or whatsApp: 8770821586
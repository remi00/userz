# Part 1. User Service

The assignment is to create a User Service Express API that allow users to register, login, logout and query others. No dedicated database should be used, each user will be stored in separate JSON file (named uuid.json) in users directory.

## `/user/` API


### - POST /user/register
```
  {
  name: "Edsger W. Dijkstra",
  email: "dijkstra@utexas.edu",
  luckyNumber: 42,
  password: "ipdPza9szGWMKgVA"
  }
```
If email and lucky number are unique user should be stored in a file `88771a2c-1ec1-11e7-93ae-92361f002671.json` (it’s just an example) located in users/ directory.


### - PUT /user/logout


### - POST /user/login

JWT or node authentication with passport npm package can be used here. 
```
  {
  email: "dijkstra@utexas.edu",
  password: "ipdPza9szGWMKgVA"
  }
```

### - POST /user/search

This post is available only for authenticated users. 
```
  {
  query: ".edu"
  }
```

### - POST /user/search RESPONSE

Expected response is an array of users that email or name matches given query. 
```
  [
  {
  name: "Edsger W. Dijkstra",
  email: "dijkstra@utexas.edu",
  uuid: "88771a2c-1ec1-11e7-93ae-92361f002671",
  points: 0
  },
  {
  name: "Donald E. Knuth",
  email: "knuth@stanford.edu",
  uid: "7a80b7d4-1ec1-11e7-93ae-92361f00267",
  points: 0
  }
  ]
```
let products = []
let newProducts = products.map((a) => { return ({'id': a.id, 'name': a.name, 'handle': a.handle, 'description': a.description })}); 
console.log(newProducts)
// return newProducts
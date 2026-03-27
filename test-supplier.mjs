async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/Proveedores/1');
    const data = await res.json();
    console.log("Supplier 1:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.log("Error:", e.message);
  }
}
test();

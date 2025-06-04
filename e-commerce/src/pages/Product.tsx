import React from "react";
import { useFetchProducts } from "../components/UseFetchProducts";
import { useEffect } from "react";
import AddProducts from "../components/AddProduct";
import UpdateProducts from "../components/UpdateProduct";
import ViewProducts from "../components/ViewProduct";
import ProductsTable from "../components/ProductsTable";

const Products: React.FC = () => {
  const { products, fetchProducts } = useFetchProducts();

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <>
      {/* <!-- Start block --> */}
      <ProductsTable />
      {/* <!-- End block --> */}
      {/* <!-- Create modal --> */}
      <AddProducts />
      {/* <!-- Update modal --> */}
      <UpdateProducts products={products} />
      {/* <!-- Read modal --> */}
      {/* <ViewProducts /> */}
      {/* <!-- Delete modal --> */}
    </>
  );
};

export default Products;

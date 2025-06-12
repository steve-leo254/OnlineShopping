import React from "react";
import { useFetchProducts } from "../components/UseFetchProducts";
import { useEffect } from "react";
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
    </>
  );
};

export default Products;

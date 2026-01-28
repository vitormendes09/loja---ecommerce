import { ProductType } from "../../types/ProductType";
import Image from "next/image";
import ProductImage from "./Productimage";

type ProductProps = {
    product: ProductType;
}

export default function Product({ product} : ProductProps) {
    return (
        <div className="flex flex-col shado-lg h-96 bg-slate-800 p-5">
            <div className="relative max-h-72 flex-1">
                <ProductImage product={product} fill />
            </div>
            <div className ="flex justify-between font-bold my-3">
                {product.title}
            </div>
            <button className="rounded-md bg-teal-600 text-white px-3.5 py-2.5 text-sm text-center hover:bg-teal-700 transition-colors">
                Adicionar ao carrinho
            </button>
        </div>
    )
}
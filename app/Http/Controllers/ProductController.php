<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // Returns full catalog structure formatted for frontend rendering
    public function index(Request $request)
    {
        $categories = Category::all();
        
        $query = Product::query();

        if ($request->has('q') && !empty($request->q)) {
            $search = strtolower($request->q);
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(note) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->boolean('in_stock')) {
            $query->where('stock', '>', 0);
        }

        if ($request->has('sort')) {
            switch ($request->sort) {
                case 'price-asc':
                    $query->orderBy('price', 'asc');
                    break;
                case 'price-desc':
                    $query->orderBy('price', 'desc');
                    break;
                case 'name':
                    $query->orderBy('name', 'asc');
                    break;
            }
        }

        $products = $query->get();

        return response()->json([
            'categories' => $categories,
            'products' => $products,
        ]);
    }
}
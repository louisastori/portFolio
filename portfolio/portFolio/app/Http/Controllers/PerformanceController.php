<?php

namespace App\Http\Controllers;

use App\Services\PerformanceSnapshotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PerformanceController extends Controller
{
    public function __construct(
        private readonly PerformanceSnapshotService $snapshotService
    ) {
    }

    public function index(Request $request): View
    {
        $snapshot = $this->snapshotService->buildSnapshot(
            $request->boolean('live')
        );

        return view('performance', [
            'snapshot' => $snapshot,
        ]);
    }

    public function live(Request $request): JsonResponse
    {
        $snapshot = $this->snapshotService->buildSnapshot(
            $request->boolean('live', true)
        );

        return response()->json($snapshot);
    }
}

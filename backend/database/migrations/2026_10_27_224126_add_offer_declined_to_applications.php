<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->timestamp('offer_declined_at')->nullable()->after('offer_accepted_at');
            $table->text('offer_decline_reason')->nullable()->after('offer_declined_at');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['offer_declined_at', 'offer_decline_reason']);
        });
    }
};

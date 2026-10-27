<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->date('joining_date')->nullable();
            $table->string('joining_location')->nullable();
            $table->longText('offer_letter_text')->nullable();
            $table->timestamp('offer_accepted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'joining_date',
                'joining_location',
                'offer_letter_text',
                'offer_accepted_at',
            ]);
        });
    }
};


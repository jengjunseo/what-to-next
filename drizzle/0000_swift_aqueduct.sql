CREATE TABLE "analysis_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"input_hash" text NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"overall_summary" jsonb NOT NULL,
	"raw_result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"record_text" text NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"grade" smallint NOT NULL,
	"semester" smallint NOT NULL,
	"subject_name" text NOT NULL,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_grade_check" CHECK ("subjects"."grade" between 1 and 3),
	CONSTRAINT "subjects_semester_check" CHECK ("subjects"."semester" between 1 and 2)
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_run_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"ai_status" text NOT NULL,
	"user_status" text,
	"strength_score" integer NOT NULL,
	"continuity_score" integer NOT NULL,
	"growth_score" integer NOT NULL,
	"major_fit_score" integer NOT NULL,
	"academic_depth_score" integer NOT NULL,
	"forced_connection_risk" integer NOT NULL,
	"evidence_record_ids" jsonb NOT NULL,
	"reasoning" text NOT NULL,
	"related_subjects" jsonb NOT NULL,
	"recommended_next_step" text NOT NULL,
	"avoid" text NOT NULL,
	"target_semester" text NOT NULL,
	"priority_rank" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "threads_ai_status_check" CHECK ("threads"."ai_status" in ('KEEP','EXTEND_NOW','RECOVER_LATER','DROP')),
	CONSTRAINT "threads_user_status_check" CHECK ("threads"."user_status" is null or "threads"."user_status" in ('KEEP','EXTEND_NOW','RECOVER_LATER','DROP')),
	CONSTRAINT "threads_target_semester_check" CHECK ("threads"."target_semester" in ('2-2','3-1','NONE')),
	CONSTRAINT "threads_strength_score_check" CHECK ("threads"."strength_score" between 0 and 100),
	CONSTRAINT "threads_continuity_score_check" CHECK ("threads"."continuity_score" between 0 and 100),
	CONSTRAINT "threads_growth_score_check" CHECK ("threads"."growth_score" between 0 and 100),
	CONSTRAINT "threads_major_fit_score_check" CHECK ("threads"."major_fit_score" between 0 and 100),
	CONSTRAINT "threads_academic_depth_score_check" CHECK ("threads"."academic_depth_score" between 0 and 100),
	CONSTRAINT "threads_forced_connection_risk_check" CHECK ("threads"."forced_connection_risk" between 0 and 100),
	CONSTRAINT "threads_priority_rank_check" CHECK ("threads"."priority_rank" is null or "threads"."priority_rank" > 0)
);
--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_analysis_run_id_analysis_runs_id_fk" FOREIGN KEY ("analysis_run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "records_subject_id_idx" ON "records" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "threads_analysis_run_id_idx" ON "threads" USING btree ("analysis_run_id");
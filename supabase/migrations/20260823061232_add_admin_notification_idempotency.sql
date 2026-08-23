create unique index admin_notifications_form_submission_recipient_unique_idx
on public.admin_notifications (recipient_id, notification_type, entity_type, entity_id)
where notification_type = 'form_submission_received'
  and entity_type = 'form_submission'
  and entity_id is not null;

comment on index public.admin_notifications_form_submission_recipient_unique_idx is 'Prevents duplicate owner notifications for the same public form submission.';

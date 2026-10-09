permit (
  principal is JalNet::User,
  action in [
    JalNet::Action::"ReadReport",
    JalNet::Action::"PresignReport",
    JalNet::Action::"CompleteUpload",
    JalNet::Action::"ConfirmReport"
  ],
  resource is JalNet::Report
)
when { resource.owner == principal };

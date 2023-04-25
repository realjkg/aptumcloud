module "gke_monitoring" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/prometheus"
  version = "~> 16.0.0"

  project_id = "mystical-button-380517"
  region     = "us-central1"
  cluster    = module.gke_cluster.cluster

  prometheus_node_exporter_enabled = true
  prometheus_service_account        = module.gke_cluster.service_account
  grafana_enabled                   = true
  grafana_service_account           = module.gke_cluster.service_account
  fluentd_enabled                   = true
  fluentd_service_account           = module.gke_cluster.service_account
}
    
resource "google_organization_iam_binding" "gke_cluster_binding" {
  org_id = "APTUMCLOUD_DEV"
  role = "roles/container.admin"

  members = [
    "serviceAccount:my-gcp-service-account@my-gcp-project.iam.gserviceaccount.com",
  ]
}

resource "google_organization_iam_binding" "gke_cluster_monitoring_binding" {
  org_id = "APTUMCLOUD_DEV"

  for_each = toset([
    "roles/logging.privateLogViewer",
    "roles/logging.logWriter",
    "roles/monitoring.editor",
    "roles/monitoring.metricWriter",
  ])

  role = each.key

  members = [
    "serviceAccount:my-gcp-service-account@my-gcp-project.iam.gserviceaccount.com",
  ]
}


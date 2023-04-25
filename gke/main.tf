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

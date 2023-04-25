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

resource "google_container_cluster" "main_cluster" {
  name               = "main-cluster"
  location           = "us-central1"
  initial_node_count = 3

  master_auth {
    username = ""
    password = ""

    client_certificate_config {
      issue_client_certificate = false
    }
  }
}
    
    
resource "google_container_cluster_oidc_authenticator_config" "oidc_auth_config" {
  count = var.authentication_method == "oidc" ? 1 : 0

  cluster_name = google_container_cluster.main_cluster.name
  location      = google_container_cluster.main_cluster.location

  oidc_config {
    issuer_url    = var.oidc_issuer_url
    client_id     = var.oidc_client_id
    k8s_api_audiences = [var.oidc_api_audience]
  }
}

resource "google_container_cluster_saml_authenticator_config" "saml_auth_config" {
  count = var.authentication_method == "saml" ? 1 : 0

  cluster_name = google_container_cluster.main_cluster.name
  location      = google_container_cluster.main_cluster.location

  saml_config {
    idp_metadata_url = var.saml_idp_metadata_url
  }
}

    
 resource "google_container_cluster" "main_cluster" {
  name               = "main-cluster"
  location           = "us-central1"
  initial_node_count = 3

  master_auth {
    username = ""
    password = ""

    client_certificate_config {
      issue_client_certificate = false
    }
  }
}
    
#encryption blocks and KMS hardening here
    
    resource "google_kms_key_ring" "kms_keyring" {
  name     = "aptum-k8s-keyring"
  location = "us-central1"
}

resource "google_kms_crypto_key" "kms_crypto_key" {
  name            = "aptum-k8s-crypto-key"
  key_ring        = google_kms_key_ring.kms_keyring.self_link
  rotation_period = "100000s"
}

    
    resource "google_storage_bucket" "encrypted_bucket" {
  name     = "aptum-k8s-${random_id.bucket_suffix.hex}"
  location = "us-central1"

  encryption {
    default_kms_key_name = google_kms_key_ring.kms_keyring.crypto_key_id
  }
}

#By setting an empty members list in the google_storage_bucket_iam_binding resource, we are effectively removing any public access bindings associated with the roles/storage.objectViewer role
resource "google_storage_bucket_iam_binding" "private_bucket" {
  bucket = google_storage_bucket.encrypted_bucket.name
  role   = "roles/storage.objectViewer"

  members = []
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}
    
    
# Ensure bucket hardening with the keyring config below
    
    resource "google_storage_bucket" "encrypted_bucket" {
  name     = "aptum-k8s-${random_id.bucket_suffix.hex}"
  location = "us-central1"

    encryption {
  default_kms_key_name = google_kms_crypto_key.kms_crypto_key.self_link
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

      #Ensure bucket access has read-only viewer role with service rbac account
     
    resource "google_service_account" "gcs_rbac_account" {
  account_id   = "gcs-rbac-account"
  display_name = "GCS RBAC Service Account"
}

resource "google_storage_bucket_iam_member" "bucket_rbac_access" {
  bucket = google_storage_bucket.encrypted_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.gcs_rbac_account.email}"
}
      
# Members only provided in the email list have access to the monitoring bucket     
# Adjust the email address(es) below to match the desired GCP account.
#      member = "serviceAccount:my-gcp-service-account@my-gcp-project.iam.gserviceaccount.com"
      

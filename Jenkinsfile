pipeline {
  agent any

  environment {
    IMAGE = 'folla25/smart-library'
  }

  stages {
    stage('Clone') {
      steps {
        git branch: 'main', url: 'https://github.com/follabm25-dev/smart-library-.git'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t $IMAGE:latest .'
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials',
            usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh 'echo $DH_PASS | docker login -u $DH_USER --password-stdin'
          sh 'docker push $IMAGE:latest'
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'kubectl apply -f k8s-deployment.yaml'
        }
      }
    }
  }
}
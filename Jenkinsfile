pipeline {
    agent any

    environment {
        // Defining environment variables for ease of use
        DOCKER_REGISTRY = "http://localhost:8082/repository/monavenir/"  // Docker registry URL
        NEXUS_CREDENTIALS_ID = "nexus-credentials"  // Credentials ID for Nexus registry
        NODE_VERSION = "20"  // Node.js version for compatibility
    }

    stages {
        stage('Checkout') {
            steps { 
                echo "Checking out the source code from the Git repository..."
                checkout scm  // Checks out the repository defined by the pipeline's Git source (defaults to the Git URL defined in Jenkins)
            }
        }

        stage('Build') {
            steps {
                echo "Starting the build process for the MERN e-learning platform..."

                // Install backend dependencies and build the backend
                dir('server') {
                    echo "Installing backend dependencies..."
                    sh 'npm install'
                    echo "Building backend application..."
                    sh 'npm run build'
                }

                // Install frontend dependencies and build the frontend
                dir('frontend') {
                    echo "Installing frontend dependencies..."
                    sh 'npm install'
                    echo "Building frontend application..."
                    sh 'npm run build'
                }

                // Build Docker images for both frontend and backend
                script {
                    echo "Building Docker images for the backend and frontend..."

                    // Build backend Docker image
                    sh "docker build -t ${DOCKER_REGISTRY}/monavenir-backend:${BUILD_NUMBER} ./backend"
                    
                    // Build frontend Docker image
                    sh "docker build -t ${DOCKER_REGISTRY}/monavenir-frontend:${BUILD_NUMBER} ./frontend"

                    // Login to Nexus Docker registry using stored credentials
                    withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}", usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        echo "Logging into Docker registry..."
                        sh "echo ${DOCKER_PASSWORD} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USERNAME} --password-stdin"
                    }

                    // Push Docker images to Nexus registry
                    echo "Pushing Docker images to Nexus registry..."
                    sh "docker push ${DOCKER_REGISTRY}/monavenir-backend:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_REGISTRY}/monavenir-frontend:${BUILD_NUMBER}"
                }

                echo "Build stage completed successfully!"
            }
        }
    }
}

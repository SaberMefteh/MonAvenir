pipeline {
    agent any

    environment {
        // Defining environment variables for ease of use
        DOCKER_REGISTRY = "localhost:8082/monavenir"  
        NEXUS_CREDENTIALS_ID = "nexus-credentials"  
        NODE_VERSION = "22"  
        IMAGE_NAME_BACKEND = "backend"  
        IMAGE_NAME_FRONTEND = "frontend" 
        IMAGE_TAG = "latest" 
        SONARQUBE_URL = "http://sonarqube-custom:9000"
        // Use credentials instead of hard-coded token
        SONARQUBE_TOKEN = credentials('SonarQubeCredential')
    }

    triggers {
        // Trigger the pipeline automatically on changes in the GitHub repository
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps { 
                echo "Checking out the source code from the Git repository..."
                checkout scm  // Checks out the repository defined by the pipeline's Git source
            }
        }

        stage('Build Application') {
            steps {
                echo "Starting the build process for the MERN e-learning platform..."

                // Install and build backend
                dir('server') {
                    echo "Installing backend dependencies..."
                    sh "npm install"
                    echo "Building backend application..."
                    sh "npm run build"
                }

                // Install and build frontend
                dir('frontend') {
                    echo "Installing frontend dependencies..."
                    sh "npm install"
                    echo "Building frontend application..."
                    sh "npm run build"
                }

                echo "Build stage completed successfully!"
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                echo "Running SonarQube analysis..."

                // Run SonarQube analysis for both frontend and backend
                dir('server') {
                    withSonarQubeEnv('SonarQube') {  // 'SonarQube' is the SonarQube server configured in Jenkins
                        sh "/opt/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=server -Dsonar.sources=. -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.login=${SONARQUBE_TOKEN}"
                    }
                }

                dir('frontend') {
                    withSonarQubeEnv('SonarQube') {
                        sh "/opt/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=frontend -Dsonar.sources=src -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.login=${SONARQUBE_TOKEN}"
                    }
                }

                echo "SonarQube analysis completed!"
            }
        }
        
        stage('Build Docker Images') {
            steps {
                echo "Building Docker images for backend and frontend..."

                // Build backend Docker image
                dir('server') {
                    echo "Building backend Docker image..."
                    sh "docker build -t ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ."
                }

                // Build frontend Docker image
                dir('frontend') {
                    echo "Building frontend Docker image..."
                    sh "docker build -t ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ."
                }

                echo "Docker images built successfully!"
            }
        }

        stage('Push Docker Images to Nexus') {
            steps {
                echo "Pushing Docker images to Nexus repository..."

                // Login to Nexus Docker registry
                withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}", 
                        usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
                    sh "echo ${NEXUS_PASSWORD} | docker login -u ${NEXUS_USERNAME} --password-stdin ${DOCKER_REGISTRY}"
                }

                // Tag and push backend image
                sh "docker tag ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"
                sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"

                // Tag and push frontend image
                sh "docker tag ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"

                echo "Docker images pushed to Nexus successfully!"
            }
        }
    }

    post {
        always {
            // Cleanup: Logout from Docker registry
            sh "docker logout ${DOCKER_REGISTRY}"
            echo "Pipeline execution completed."
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Check the logs for details."
        }
    }
}

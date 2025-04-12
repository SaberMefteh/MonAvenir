pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "d35d-154-111-101-147.ngrok-free.app/monavenir"
        NEXUS_CREDENTIALS_ID = "nexus-credentials"
        NODE_VERSION = "22"
        IMAGE_NAME_BACKEND = "backend"
        IMAGE_NAME_FRONTEND = "frontend"
        IMAGE_TAG = "latest"
        SONARQUBE_URL = "http://sonarqube-custom:9000"
        SONARQUBE_TOKEN = credentials('SonarQubeCredential')
        BACKEND_APP_NAME = "monAvenir"
        FRONTEND_APP_NAME = "monavenirFront"
        RESOURCE_GROUP = "PFE"
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out the source code from the Git repository..."
                checkout scm
            }
        }

        stage('Build Application') {
            steps {
                echo "Starting the build process for the MERN e-learning platform..."

                dir('server') {
                    echo "Installing backend dependencies..."
                    sh "npm install"
                    echo "Building backend application..."
                    sh "npm run build"
                }

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

                dir('server') {
                    withSonarQubeEnv('SonarQube') {
                        sh "/opt/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=server -Dsonar.sources=. -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.login=${SONARQUBE_TOKEN} -X"
                    }
                }

                dir('frontend') {
                    withSonarQubeEnv('SonarQube') {
                        sh "/opt/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=frontend -Dsonar.sources=src -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.login=${SONARQUBE_TOKEN} -X"
                    }
                }

                echo "SonarQube analysis is completed!"
            }
        }     


       


        

        
        stage('Build Docker Images') {
            steps {
                echo "Building Docker images for backend and frontend..."

                dir('server') {
                    echo "Building backend Docker image..."
                    sh "docker build -t ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ."
                }

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

                withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}",
                        usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {

                    sh "echo ${NEXUS_PASSWORD} | docker login -u ${NEXUS_USERNAME} --password-stdin ${DOCKER_REGISTRY}"

                    sh "docker tag ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"

                    sh "docker tag ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                }

                echo "Docker images pushed to Nexus successfully!"
            }
        }





        stage('Deploy to Azure App Service') {
    steps {
        script {
            withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}",
                    usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {

                // Corrected registry URL syntax
                sh """
                az webapp config container set \
                    --name $BACKEND_APP_NAME \
                    --resource-group $RESOURCE_GROUP \
                    --container-image-name $DOCKER_REGISTRY/${IMAGE_NAME_BACKEND}:${IMAGE_TAG} \
                    --container-registry-url ${DOCKER_REGISTRY} \
                    --container-registry-user ${NEXUS_USERNAME} \
                    --container-registry-password ${NEXUS_PASSWORD}
                """

                sh """
                az webapp config container set \
                    --name $FRONTEND_APP_NAME \
                    --resource-group $RESOURCE_GROUP \
                    --container-image-name $DOCKER_REGISTRY/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} \
                    --container-registry-url ${DOCKER_REGISTRY} \
                    --container-registry-user ${NEXUS_USERNAME} \
                    --container-registry-password ${NEXUS_PASSWORD}
                """
            }
        }
    }
}



        
    }

    post {
        always {
            sh "docker logout ${DOCKER_REGISTRY}"
            sh "az logout"
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

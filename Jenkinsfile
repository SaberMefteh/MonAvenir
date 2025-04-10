pipeline {
    agent any

    environment {
        // Docker & Nexus config
        DOCKER_REGISTRY = "your-nexus-domain:8082/monavenir"
        NEXUS_CREDENTIALS_ID = "nexus-credentials"
       
        // Node version
        NODE_VERSION = "22"
       
        // Docker image settings
        IMAGE_NAME_BACKEND = "backend"
        IMAGE_NAME_FRONTEND = "frontend"
        IMAGE_TAG = "latest"
       
        // SonarQube
        SONARQUBE_URL = "http://sonarqube-custom:9000"
        SONARQUBE_TOKEN = credentials('SonarQubeCredential')
       
        // Azure
        AZURE_CREDENTIALS_ID = "azure-service-principal"
        RESOURCE_GROUP = "your-resource-group"
        BACKEND_APP_NAME = "monavenir-backend"
        FRONTEND_APP_NAME = "monavenir-frontend"
        DOCKER_REGISTRY_URL = "https://your-nexus-domain:8082"
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out source code..."
                checkout scm
            }
        }

        stage('Build Application') {
            steps {
                echo "Building backend and frontend..."
                dir('server') {
                    sh "npm install"
                    sh "npm run build"
                }
                dir('frontend') {
                    sh "npm install"
                    sh "npm run build"
                }
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
            }
        }

        stage('Build Docker Images') {
            steps {
                echo "Building Docker images..."
                dir('server') {
                    sh "docker build -t ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ."
                }
                dir('frontend') {
                    sh "docker build -t ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ."
                }
            }
        }

        stage('Push Docker Images to Nexus') {
            steps {
                echo "Pushing images to Nexus..."
                withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}", usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
                    sh "echo ${NEXUS_PASSWORD} | docker login -u ${NEXUS_USERNAME} --password-stdin ${DOCKER_REGISTRY}"

                    // Push backend
                    sh "docker tag ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"

                    // Push frontend
                    sh "docker tag ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                }
            }
        }

        stage('Deploy to Azure App Service') {
            steps {
                echo "Deploying Docker images to Azure App Services from Nexus..."

                withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}", usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD'),
                                 usernamePassword(credentialsId: "${AZURE_CREDENTIALS_ID}", usernameVariable: 'AZURE_CLIENT_ID', passwordVariable: 'AZURE_SECRET')]) {

                    // Login to Azure
                    sh """
                    az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_SECRET --tenant your-tenant-id
                    """

                    // Deploy backend
                    sh """
                    az webapp config container set \
                        --name ${BACKEND_APP_NAME} \
                        --resource-group ${RESOURCE_GROUP} \
                        --docker-custom-image-name ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG} \
                        --docker-registry-server-url ${DOCKER_REGISTRY_URL} \
                        --docker-registry-server-user $NEXUS_USERNAME \
                        --docker-registry-server-password $NEXUS_PASSWORD
                    """

                    // Deploy frontend
                    sh """
                    az webapp config container set \
                        --name ${FRONTEND_APP_NAME} \
                        --resource-group ${RESOURCE_GROUP} \
                        --docker-custom-image-name ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} \
                        --docker-registry-server-url ${DOCKER_REGISTRY_URL} \
                        --docker-registry-server-user $NEXUS_USERNAME \
                        --docker-registry-server-password $NEXUS_PASSWORD
                    """

                    // Restart apps (optional)
                    sh "az webapp restart --name ${BACKEND_APP_NAME} --resource-group ${RESOURCE_GROUP}"
                    sh "az webapp restart --name ${FRONTEND_APP_NAME} --resource-group ${RESOURCE_GROUP}"
                }
            }
        }
    }

    post {
        always {
            sh "docker logout ${DOCKER_REGISTRY}"
            echo "Pipeline finished (cleanup done)."
        }
        success {
            echo " Pipeline completed successfully!"
        }
        failure {
            echo " Pipeline failed. Please check the logs!"
        }
    }
}

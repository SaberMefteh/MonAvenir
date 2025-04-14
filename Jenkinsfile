pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "d260-196-179-173-158.ngrok-free.app"
        NEXUS_CREDENTIALS_ID = "nexus-credentials"
        NODE_VERSION = "22"
        IMAGE_NAME_BACKEND = "monavenir/backend"
        IMAGE_NAME_FRONTEND = "monavenir/frontend"
        IMAGE_TAG = "${BUILD_NUMBER}"
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
 


            /*
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

            */
        

        
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

                    sh '''    echo "$NEXUS_PASSWORD" | docker login -u "$NEXUS_USERNAME" --password-stdin "$DOCKER_REGISTRY"     '''

                    // In Push Docker Images stage, change to:
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
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'Azure',
                            usernameVariable: 'AZURE_USER',
                            passwordVariable: 'AZURE_PASSWORD'
                        ),
                        usernamePassword(
                            credentialsId: "${NEXUS_CREDENTIALS_ID}",
                            usernameVariable: 'NEXUS_USERNAME',
                            passwordVariable: 'NEXUS_PASSWORD'
                        )
                    ]) {
                        // Authenticate to Azure
                        sh '''
                            az login --username "$AZURE_USER" --password "$AZURE_PASSWORD"
                        '''

                        // Deploy Backend
                        sh """
                            az webapp config container set \
                                --name $BACKEND_APP_NAME \
                                --resource-group $RESOURCE_GROUP \
                                --container-image-name $DOCKER_REGISTRY/${IMAGE_NAME_BACKEND}:${IMAGE_TAG} \
                                --container-registry-url ${DOCKER_REGISTRY} \
                                --container-registry-user ${NEXUS_USERNAME} \
                                --container-registry-password ${NEXUS_PASSWORD}
                        """

                        // Deploy Frontend
                        sh """
                            az webapp config container set \
                                --name $FRONTEND_APP_NAME \
                                --resource-group $RESOURCE_GROUP \
                                --container-image-name $DOCKER_REGISTRY/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} \
                                --container-registry-url ${DOCKER_REGISTRY} \
                                --container-registry-user ${NEXUS_USERNAME} \
                                --container-registry-password ${NEXUS_PASSWORD}
                        """
        
                        // Deploy Frontend
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


    }

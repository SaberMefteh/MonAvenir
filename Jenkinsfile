pipeline {
    agent any

    environment {
        // Defining environment variables for ease of use
        GIT_REPO = "https://github.com/SaberMefteh/MonAvenir.git"  // GitHub repo URL
        BACKEND_IMAGE = "sabermefteh/monavenir-backend"
        FRONTEND_IMAGE = "sabermefteh/monavenir-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Cloning repository from GitHub..."

                // Checkout the repository
                checkout scm

                echo "Repository cloned successfully!"
            }
        }

        stage('Build Backend') {
            steps {
                echo "Building the backend..."

                // Install backend dependencies and build
                dir('server') {
                    echo "Installing backend dependencies..."
                    sh 'npm install'  // Install backend dependencies
                    echo "Building backend..."
                    sh 'npm run build'  // Build backend

                    // Build Docker image for backend
                    echo "Building Docker image for backend..."
                    sh 'docker build -t ${BACKEND_IMAGE} .'
                    echo "Backend Docker image built successfully!"
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo "Building the frontend..."

                // Install frontend dependencies and build
                dir('frontend') {
                    echo "Installing frontend dependencies..."
                    sh 'npm install'  // Install frontend dependencies
                    echo "Building frontend..."
                    sh 'npm run build'  // Build frontend

                    // Build Docker image for frontend
                    echo "Building Docker image for frontend..."
                    sh 'docker build -t ${FRONTEND_IMAGE} .'
                    echo "Frontend Docker image built successfully!"
                }
            }
        }
    }
}

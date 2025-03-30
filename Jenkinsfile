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

               

                echo "Build stage completed successfully!"
            }
        }
    }
}

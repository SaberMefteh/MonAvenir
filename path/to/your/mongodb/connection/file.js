const mongoose = require('mongoose');

mongoose.connect(MONGO_URI, {
    // ... existing options ...
    // useNewUrlParser: true,
    // useUnifiedTopology: true
}); 
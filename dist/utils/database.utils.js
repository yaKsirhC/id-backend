import mongoose from "mongoose";
const connectDatabase = async ()=>{
    try {
        await mongoose.connect('mongodb+srv://database:hWM2HyEIqWGxCOqZ@cluster0.q4wk160.mongodb.net/?retryWrites=true&w=majority');
    } catch (err) {
        console.log('Not possible to connect to database');
    }
};
export { connectDatabase };

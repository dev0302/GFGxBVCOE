import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/quiz_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ Connection error:", err));


const team = [
  {
    "Team ID": "UUR83N58",
    "Team Name": "NaN",
    "Candidate's Name": "Jahanvi Rokade"
  },
  {
    "Team ID": "U1FQ351E",
    "Team Name": "Diamond Blender",
    "Candidate's Name": "Ayush Kumar Ojha"
  },
  {
    "Team ID": "US0B3N49",
    "Team Name": "Big Boys",
    "Candidate's Name": "Ayush Mittal"
  },
];

const initdb = async()=>{
    await model.insertMany(team);
    console.log("succesfull saved");
}
initdb();
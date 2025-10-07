import Team from "../models/Team.js";

export const checkTeam = async (req, res)=>{
    const {teamId} = req.body;

    if(!teamId){
        throw new Error("team ID is required")
    }

    const existedTeam = await Team.findOne({teamId}).select("-score")

    if(!existedTeam){
        throw new Error("team not found please make sure the team id is correct")
    }

    res
    .status(201)
    .json(
        {
            ...existedTeam
        }
    )
}


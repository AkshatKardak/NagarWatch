import { Complaint, type IComplaint } from "../models/Complaint";
import { Ward, type IWard } from "../models/Ward";

type NearbyComplaint = IComplaint & { distance?: number };

export async function findNearbyComplaints(
  lng: number,
  lat: number,
  radiusMeters = 50
): Promise<NearbyComplaint[]> {
  const complaints = await Complaint.aggregate<NearbyComplaint>([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distance",
        maxDistance: radiusMeters,
        spherical: true,
        query: { status: { $ne: "resolved" } },
      },
    },
    { $limit: 5 },
  ]);

  console.log(`Found ${complaints.length} nearby complaints within ${radiusMeters}m`);
  return complaints;
}

export async function assignWardToComplaint(lng: number, lat: number): Promise<IWard | null> {
  const ward = await Ward.findOne({
    isActive: true,
    boundary: {
      $geoIntersects: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
      },
    },
  }).lean<IWard | null>();

  console.log(`Ward assignment lookup completed for coordinates ${lng},${lat}`);
  return ward;
}

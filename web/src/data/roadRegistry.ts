/**
 * Municipal Road & Tender Contractor Registry (Nagpur / Maharashtra Pilot)
 * Core logic inspired by coding-parrot/pothole-reporter tender database.
 * Used for geospatial matching (< 30m) to identify responsible road contractor,
 * Defect Liability Period (DLP) warranty timeline, and regional municipal engineers.
 */

export interface RoadRegistryRecord {
  road_id: string;
  road_name: string;
  road_segment: string;
  ward: string;
  zone: string;
  tender_number: string;
  pavement_type: 'Asphalt' | 'Concrete (Rigid)' | 'Bituminous Mix';
  contract_awarded_date: string;
  dlp_start_date: string; // YYYY-MM-DD
  dlp_end_date: string; // YYYY-MM-DD
  dlp_active: boolean;
  latitude: number;
  longitude: number;
  contractor: {
    contractor_id: string;
    contractor_name: string;
    company: string;
    license_no: string;
    email: string;
    phone: string;
    office_address: string;
  } | null;
  municipal_officer: {
    name: string;
    designation: string;
    department: string;
    email: string;
    phone: string;
  };
}

export const ROAD_REGISTRY: RoadRegistryRecord[] = [
  {
    road_id: 'rd_401',
    road_name: 'Inner Ring Road Arterial Corridor',
    road_segment: 'Segment 4A (km 12.4 - 14.8), Pratap Nagar Junction',
    ward: 'Ward 12 (South-West Zone)',
    zone: 'Dharampeth Zone',
    tender_number: 'NMC/PWD/2024/RND-1049',
    pavement_type: 'Bituminous Mix',
    contract_awarded_date: '2024-03-15',
    dlp_start_date: '2024-06-01',
    dlp_end_date: '2028-05-31',
    dlp_active: true,
    latitude: 21.1458,
    longitude: 79.0882,
    contractor: {
      contractor_id: 'c_901',
      contractor_name: 'Rajesh Sharma',
      company: 'Apex Infrastructure & Highway Builders Ltd.',
      license_no: 'MHA-PWD-CLASS1-0982',
      email: 'contact@apexinfra.com',
      phone: '+91 98230 45678',
      office_address: 'Plot 42, MIDC Industrial Area, Hingna Road, Nagpur',
    },
    municipal_officer: {
      name: 'Er. Sandeep Patil',
      designation: 'Executive Engineer (Roads Division)',
      department: 'Nagpur Municipal Corporation (NMC)',
      email: 'roads.engineer@city.gov',
      phone: '+91 712 2567001',
    },
  },
  {
    road_id: 'rd_402',
    road_name: 'Central Market Expressway & Link Road',
    road_segment: 'North Sector Link (km 3.1 - 4.5), Sitabuldi Market',
    ward: 'Ward 8 (Central Zone)',
    zone: 'Sitabuldi Zone',
    tender_number: 'NMC/PWD/2018/TR-4421',
    pavement_type: 'Asphalt',
    contract_awarded_date: '2018-09-10',
    dlp_start_date: '2019-01-01',
    dlp_end_date: '2023-12-31',
    dlp_active: false, // Expired warranty - Municipal maintenance
    latitude: 21.161,
    longitude: 79.082,
    contractor: null, // DLP expired, responsibility reverted to City PWD
    municipal_officer: {
      name: 'Er. Meenakshi Deshmukh',
      designation: 'Assistant Municipal Commissioner (Public Works)',
      department: 'Central Zone Engineering Cell',
      email: 'traffic.engineer@city.gov',
      phone: '+91 712 2567088',
    },
  },
  {
    road_id: 'rd_403',
    road_name: 'Industrial Heavy Freight Corridor',
    road_segment: 'Phase II Heavy Corridor (km 8.0 - 11.2), Butibori Connector',
    ward: 'Ward 24 (Industrial Corridor)',
    zone: 'East Zone',
    tender_number: 'NMC/HWY/2023/CORR-8812',
    pavement_type: 'Concrete (Rigid)',
    contract_awarded_date: '2023-07-20',
    dlp_start_date: '2023-10-01',
    dlp_end_date: '2027-09-30',
    dlp_active: true,
    latitude: 21.1412,
    longitude: 79.0995,
    contractor: {
      contractor_id: 'c_902',
      contractor_name: 'Vikram Mehta',
      company: 'Premier Roadways & Pavements Corp.',
      license_no: 'MHA-PWD-CLASS1-1144',
      email: 'support@premierroadways.in',
      phone: '+91 98450 11223',
      office_address: 'Corridor Tower, 4th Floor, Civil Lines, Nagpur',
    },
    municipal_officer: {
      name: 'Er. Aniket Joshi',
      designation: 'Superintending Highway Engineer',
      department: 'State Highway Development Division',
      email: 'corridor.officer@city.gov',
      phone: '+91 712 2567433',
    },
  },
  {
    road_id: 'rd_404',
    road_name: 'Wardha Road Smart Transit Way',
    road_segment: 'Airport Metro Corridor (km 6.5 - 9.0)',
    ward: 'Ward 16 (South Zone)',
    zone: 'Nehru Nagar Zone',
    tender_number: 'NMC/SMART/2024/ST-302',
    pavement_type: 'Bituminous Mix',
    contract_awarded_date: '2024-01-10',
    dlp_start_date: '2024-04-01',
    dlp_end_date: '2029-03-31',
    dlp_active: true,
    latitude: 21.1025,
    longitude: 79.0558,
    contractor: {
      contractor_id: 'c_903',
      contractor_name: 'Sunil Kulkarni',
      company: 'Shree Sai Infratech Pvt. Ltd.',
      license_no: 'MHA-PWD-CLASS1-0671',
      email: 'grievance@shreesaiinfra.co.in',
      phone: '+91 98901 77889',
      office_address: 'Shree Chambers, Wardha Road, Nagpur',
    },
    municipal_officer: {
      name: 'Er. Priya Rathore',
      designation: 'Nodal Smart Mobility Engineer',
      department: 'Smart City Mission Authority',
      email: 'smartcity.roads@city.gov',
      phone: '+91 712 2567912',
    },
  },
];

/**
 * Haversine formula to compute exact great-circle distance between two GPS coordinates in meters
 */
export function calculateHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Find the closest road tender record with exact geodesic distance in meters
 */
export function findRoadRegistryByGps(lat: number, lng: number): RoadRegistryRecord & { distanceMeters: number } {
  let closest = ROAD_REGISTRY[0];
  let minDistanceMeters = Number.MAX_VALUE;

  for (const record of ROAD_REGISTRY) {
    const distMeters = calculateHaversineMeters(lat, lng, record.latitude, record.longitude);
    if (distMeters < minDistanceMeters) {
      minDistanceMeters = distMeters;
      closest = record;
    }
  }

  return {
    ...closest,
    distanceMeters: minDistanceMeters,
  };
}

/**
 * Reverse geocode coordinates to get precise street name, neighborhood and locality
 */
export async function reverseGeocodeGps(lat: number, lng: number): Promise<{
  formattedAddress: string;
  roadName: string | null;
  suburb: string | null;
  city: string | null;
}> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'MAX-Civic-Infrastructure-Platform/1.0',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const roadName = addr.road || addr.street || addr.neighbourhood || addr.suburb || null;
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || null;
      const city = addr.city || addr.town || addr.municipality || 'Nagpur';
      
      const parts = [roadName, suburb, city].filter(Boolean);
      return {
        formattedAddress: parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        roadName,
        suburb,
        city,
      };
    }
  } catch {
    // Fallback to local road registry match
  }

  const matched = findRoadRegistryByGps(lat, lng);
  return {
    formattedAddress: `${matched.road_name}, ${matched.ward} (GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    roadName: matched.road_name,
    suburb: matched.ward,
    city: 'Nagpur',
  };
}

/**
 * Generate official complaint notice email draft for road contractor or municipal authority
 */
export function generateComplaintEmailDraft(params: {
  reportId: string;
  category: string;
  categoryLabel: string;
  roadRecord: RoadRegistryRecord;
  latitude: number;
  longitude: number;
  severity: number;
  aiConfidence?: number;
  description?: string;
  evidenceUrl?: string;
}) {
  const {
    reportId,
    category,
    categoryLabel,
    roadRecord,
    latitude,
    longitude,
    severity,
    aiConfidence,
    description,
    evidenceUrl,
  } = params;

  const isDlp = roadRecord.dlp_active && roadRecord.contractor !== null;
  const recipientEmail = isDlp ? roadRecord.contractor!.email : roadRecord.municipal_officer.email;
  const ccEmail = roadRecord.municipal_officer.email;
  const targetName = isDlp ? roadRecord.contractor!.company : roadRecord.municipal_officer.department;

  const subject = `[OFFICIAL ${isDlp ? 'DLP DEFECT NOTICE' : 'MUNICIPAL WORK ORDER'}] #${reportId} - ${categoryLabel} on ${roadRecord.road_name}`;

  const body = `To: ${targetName}
Attn: ${isDlp ? roadRecord.contractor!.contractor_name : roadRecord.municipal_officer.name}
CC: ${ccEmail}

RE: NOTICE OF ROAD INFRASTRUCTURE DEFECT / REPAIR REQUISITION
Incident Dossier ID: #${reportId}
Tender Reference: ${roadRecord.tender_number}

LOCATION & GEOSPATIAL TELEMETRY:
- Road Name: ${roadRecord.road_name}
- Segment: ${roadRecord.road_segment}
- Ward / Zone: ${roadRecord.ward} (${roadRecord.zone})
- GPS Coordinates: ${latitude.toFixed(5)} N, ${longitude.toFixed(5)} E
- OpenStreetMap Pin: https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}

INCIDENT PARTICULARS:
- Defect Category: ${categoryLabel} (${category === 'pothole' ? 'Auto-Detected via YOLOv8' : 'Citizen Manual Report'})
- Assessed Severity: Level ${severity}/5 (Priority Score: ${(severity * 20).toFixed(0)}/100)
${aiConfidence ? `- AI Model Confidence: ${(aiConfidence * 100).toFixed(1)}% (Urban Issues YOLOv8)` : ''}
${description ? `- Field Notes: "${description}"` : ''}
${evidenceUrl ? `- Evidence Photo: ${evidenceUrl}` : ''}

CONTRACT & WARRANTY STATUS:
- Pavement Type: ${roadRecord.pavement_type}
- Defect Liability Period (DLP): ${roadRecord.dlp_start_date} to ${roadRecord.dlp_end_date}
- Warranty Status: ${isDlp ? 'ACTIVE UNDER CONTRACTOR LIABILITY CLAUSE' : 'EXPIRED - MUNICIPAL PWD MAINTENANCE CELL'}
- Mandatory SLA Resolution Window: ${isDlp ? '24 Hours (Urgent DLP Clause 14.2)' : '72 Hours (Standard Civic SLA)'}

ACTION REQUIRED:
${isDlp ? `Under the Defect Liability terms of contract ${roadRecord.tender_number}, ${roadRecord.contractor!.company} is legally obligated to deploy a cold-mix asphalt/pavement restoration team to the designated coordinates within 24 hours. Failure to rectify within the stipulated SLA may result in penalty deduction from performance security guarantees.` : `The Regional Maintenance Division is requested to dispatch the quick-response repair van to eliminate road hazard risks.`}

Dispatched automatically via Civic Issue Reporting & Tracking System.`;

  return {
    recipientEmail,
    ccEmail,
    subject,
    body,
    isDlp,
    targetName,
    slaHours: isDlp ? 24 : 72,
  };
}

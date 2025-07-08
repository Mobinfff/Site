import api from './api'; // Your pre-configured axios instance

// Define the shape of a Club based on your backend Club entity (public view)
// This should be more detailed and match your backend response.
export interface ClubSummary {
  id: string;
  name: string;
  address: string;
  status?: string; // e.g., 'APPROVED'
  is_active?: boolean;
  images?: Array<{ id: string; image_url: string; is_cover?: boolean; alt_text?: string }>;
  sport_types?: Array<{ id: number; name: string }>;
  facilities?: Array<{ id: number; name: string }>;
  // average_rating?: number; // Example
  // Add other fields you expect in the club list
}

export interface GetClubsParams {
  name?: string;
  sport_type_id?: number;
  facility_id?: number;
  is_featured?: boolean;
  page?: number;
  limit?: number;
  // Add other potential filter parameters
  status?: string; // For admin or specific views, not typically for public approved list
}

// Define a more generic response type if your backend wraps data
// interface PaginatedResponse<T> {
//   data: T[];
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }


// Fetches publicly available (approved and active) clubs
export const getPublicClubsApi = async (params?: GetClubsParams): Promise<ClubSummary[]> => {
  // The public endpoint `/clubs` in backend is already filtered for APPROVED and ACTIVE.
  // So, no need to pass status: 'APPROVED' here unless the backend endpoint behavior changes.
  const response = await api.get<ClubSummary[]>('/clubs', { params });
  return response.data; // Assuming backend directly returns an array of clubs
                        // If it's { data: [], ...pagination }, then return response.data.data
};

// Fetches a single club's public details
export const getPublicClubDetailsApi = async (clubId: string): Promise<ClubSummary> => { // Use a more detailed ClubDetail interface if needed
  const response = await api.get<ClubSummary>(`/clubs/${clubId}`);
  return response.data;
};


// --- For Club Owners / Admins (examples) ---

// export const createClubApi = async (clubData: any) => { // Replace 'any' with CreateClubDto from backend
//   const response = await api.post('/clubs', clubData);
//   return response.data;
// };

// export const updateClubApi = async (clubId: string, clubData: any) => { // Replace 'any' with UpdateClubDto
//   const response = await api.patch(`/clubs/${clubId}`, clubData);
//   return response.data;
// };

// export const getMyClubsApi = async (params?: GetClubsParams): Promise<ClubSummary[]> => {
//   const response = await api.get<ClubSummary[]>('/clubs/my-clubs', { params });
//   return response.data;
// };

// export const getAllClubsForAdminApi = async (params?: GetClubsParams): Promise<ClubSummary[]> => {
//   const response = await api.get<ClubSummary[]>('/clubs/admin/all', { params });
//   return response.data;
// };

// Add other club related API calls here (images, schedules etc. if they are under club service)

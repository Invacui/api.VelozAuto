/**
 * @file india.ts
 * @description Indian master geography: states/UTs, sample cities and RTO codes.
 *              Used by validators, seeds and the Location master model.
 * @module Constants
 * @author VehicleMarket Backend
 */

export interface RtoSample {
  code: string;
  city: string;
}

export interface StateData {
  name: string;
  code: string;
  cities: string[];
  rtoSamples: RtoSample[];
}

/** All 28 states + 8 UTs with major cities and representative RTO codes. */
export const INDIAN_STATES: StateData[] = [
  { name: 'Andhra Pradesh', code: 'AP', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kurnool'], rtoSamples: [{ code: 'AP31', city: 'Visakhapatnam' }, { code: 'AP16', city: 'Vijayawada' }] },
  { name: 'Arunachal Pradesh', code: 'AR', cities: ['Itanagar', 'Naharlagun', 'Pasighat'], rtoSamples: [{ code: 'AR01', city: 'Itanagar' }] },
  { name: 'Assam', code: 'AS', cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'], rtoSamples: [{ code: 'AS01', city: 'Guwahati' }, { code: 'AS03', city: 'Dibrugarh' }] },
  { name: 'Bihar', code: 'BR', cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'], rtoSamples: [{ code: 'BR01', city: 'Patna' }, { code: 'BR06', city: 'Muzaffarpur' }] },
  { name: 'Chhattisgarh', code: 'CG', cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'], rtoSamples: [{ code: 'CG04', city: 'Raipur' }, { code: 'CG11', city: 'Bilaspur' }] },
  { name: 'Goa', code: 'GA', cities: ['Panaji', 'Margao', 'Vasco da Gama'], rtoSamples: [{ code: 'GA01', city: 'Panaji' }, { code: 'GA03', city: 'Margao' }] },
  { name: 'Gujarat', code: 'GJ', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar'], rtoSamples: [{ code: 'GJ01', city: 'Ahmedabad' }, { code: 'GJ05', city: 'Surat' }, { code: 'GJ03', city: 'Vadodara' }] },
  { name: 'Haryana', code: 'HR', cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Hisar', 'Karnal'], rtoSamples: [{ code: 'HR26', city: 'Gurugram' }, { code: 'HR51', city: 'Faridabad' }, { code: 'HR06', city: 'Karnal' }] },
  { name: 'Himachal Pradesh', code: 'HP', cities: ['Shimla', 'Mandi', 'Solan', 'Dharamshala'], rtoSamples: [{ code: 'HP01', city: 'Shimla' }, { code: 'HP09', city: 'Dharamshala' }] },
  { name: 'Jharkhand', code: 'JH', cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'], rtoSamples: [{ code: 'JH01', city: 'Ranchi' }, { code: 'JH05', city: 'Jamshedpur' }] },
  { name: 'Karnataka', code: 'KA', cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'], rtoSamples: [{ code: 'KA01', city: 'Bengaluru' }, { code: 'KA05', city: 'Mysuru' }, { code: 'KA19', city: 'Mangaluru' }] },
  { name: 'Kerala', code: 'KL', cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'], rtoSamples: [{ code: 'KL01', city: 'Thiruvananthapuram' }, { code: 'KL07', city: 'Kochi' }, { code: 'KL11', city: 'Kozhikode' }] },
  { name: 'Madhya Pradesh', code: 'MP', cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'], rtoSamples: [{ code: 'MP04', city: 'Bhopal' }, { code: 'MP09', city: 'Indore' }, { code: 'MP23', city: 'Jabalpur' }] },
  { name: 'Maharashtra', code: 'MH', cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur'], rtoSamples: [{ code: 'MH01', city: 'Mumbai' }, { code: 'MH12', city: 'Pune' }, { code: 'MH31', city: 'Nagpur' }, { code: 'MH04', city: 'Thane' }] },
  { name: 'Manipur', code: 'MN', cities: ['Imphal', 'Thoubal'], rtoSamples: [{ code: 'MN01', city: 'Imphal' }] },
  { name: 'Meghalaya', code: 'ML', cities: ['Shillong', 'Tura'], rtoSamples: [{ code: 'ML01', city: 'Shillong' }] },
  { name: 'Mizoram', code: 'MZ', cities: ['Aizawl', 'Lunglei'], rtoSamples: [{ code: 'MZ01', city: 'Aizawl' }] },
  { name: 'Nagaland', code: 'NL', cities: ['Kohima', 'Dimapur'], rtoSamples: [{ code: 'NL01', city: 'Kohima' }, { code: 'NL07', city: 'Dimapur' }] },
  { name: 'Odisha', code: 'OD', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur'], rtoSamples: [{ code: 'OD02', city: 'Bhubaneswar' }, { code: 'OD05', city: 'Rourkela' }] },
  { name: 'Punjab', code: 'PB', cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali'], rtoSamples: [{ code: 'PB10', city: 'Ludhiana' }, { code: 'PB02', city: 'Amritsar' }, { code: 'PB08', city: 'Jalandhar' }] },
  { name: 'Rajasthan', code: 'RJ', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'], rtoSamples: [{ code: 'RJ14', city: 'Jaipur' }, { code: 'RJ19', city: 'Jodhpur' }, { code: 'RJ27', city: 'Udaipur' }] },
  { name: 'Sikkim', code: 'SK', cities: ['Gangtok', 'Namchi'], rtoSamples: [{ code: 'SK01', city: 'Gangtok' }] },
  { name: 'Tamil Nadu', code: 'TN', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur'], rtoSamples: [{ code: 'TN09', city: 'Chennai' }, { code: 'TN33', city: 'Coimbatore' }, { code: 'TN58', city: 'Madurai' }] },
  { name: 'Telangana', code: 'TS', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'], rtoSamples: [{ code: 'TS07', city: 'Hyderabad' }, { code: 'TS09', city: 'Warangal' }] },
  { name: 'Tripura', code: 'TR', cities: ['Agartala', 'Udaipur'], rtoSamples: [{ code: 'TR01', city: 'Agartala' }] },
  { name: 'Uttar Pradesh', code: 'UP', cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Noida', 'Meerut'], rtoSamples: [{ code: 'UP16', city: 'Noida' }, { code: 'UP32', city: 'Lucknow' }, { code: 'UP78', city: 'Ghaziabad' }, { code: 'UP65', city: 'Kanpur' }] },
  { name: 'Uttarakhand', code: 'UK', cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani'], rtoSamples: [{ code: 'UK07', city: 'Dehradun' }, { code: 'UK08', city: 'Haridwar' }] },
  { name: 'West Bengal', code: 'WB', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'], rtoSamples: [{ code: 'WB02', city: 'Kolkata' }, { code: 'WB73', city: 'Siliguri' }] },
  { name: 'Andaman and Nicobar Islands', code: 'AN', cities: ['Port Blair'], rtoSamples: [{ code: 'AN01', city: 'Port Blair' }] },
  { name: 'Chandigarh', code: 'CH', cities: ['Chandigarh'], rtoSamples: [{ code: 'CH01', city: 'Chandigarh' }] },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DH', cities: ['Daman', 'Diu', 'Silvassa'], rtoSamples: [{ code: 'DH01', city: 'Daman' }] },
  { name: 'Delhi', code: 'DL', cities: ['New Delhi', 'Delhi'], rtoSamples: [{ code: 'DL01', city: 'Delhi' }, { code: 'DL02', city: 'Delhi' }, { code: 'DL03', city: 'Delhi' }] },
  { name: 'Jammu and Kashmir', code: 'JK', cities: ['Srinagar', 'Jammu', 'Anantnag'], rtoSamples: [{ code: 'JK01', city: 'Srinagar' }, { code: 'JK02', city: 'Jammu' }] },
  { name: 'Ladakh', code: 'LA', cities: ['Leh', 'Kargil'], rtoSamples: [{ code: 'LA01', city: 'Leh' }] },
  { name: 'Lakshadweep', code: 'LD', cities: ['Kavaratti'], rtoSamples: [{ code: 'LD01', city: 'Kavaratti' }] },
  { name: 'Puducherry', code: 'PY', cities: ['Puducherry', 'Karaikal'], rtoSamples: [{ code: 'PY01', city: 'Puducherry' }] },
];

export const STATE_NAMES = INDIAN_STATES.map((s) => s.name);

/** Indian states/UT names for Joi `valid(...)`. */
export const STATE_VALIDATORS = [...STATE_NAMES];

/** Turns a parser response into form values, ignoring placeholder defaults. */
export const usableParsedFields = (d = {}) => {
  const usable = new Set([...(d.fieldsFound || []), ...(d.fieldsInferred || [])]);
  // Older parser responses without provenance: treat every non-empty value as usable.
  const has = (key) => (d.fieldsFound ? usable.has(key) : Boolean(d[key]));
  return {
    name: has("name") ? d.name : undefined,
    currentCompany: has("currentCompany") ? d.currentCompany : undefined,
    currentRole: has("currentRole") ? d.currentRole : undefined,
    branch: has("branch") ? d.branch : undefined,
    batch: has("batch") ? d.batch : undefined,
    skills: has("skills") ? d.skills : undefined,
    linkedinUrl: has("linkedinUrl") ? d.linkedinUrl : undefined,
    education: has("education") ? d.education : undefined,
    experience: has("experience") ? d.experience : undefined,
  };
};

export const DB = {
    getGoals: () => JSON.parse(localStorage.getItem('goals') || '[]'),
    saveGoals: (data) => localStorage.setItem('goals', JSON.stringify(data)),
    getSeeds: () => JSON.parse(localStorage.getItem('seeds') || '[]'),
    saveSeeds: (data) => localStorage.setItem('seeds', JSON.stringify(data)),
    getConfig: () => JSON.parse(localStorage.getItem('config') || '{"time": "22:00", "notify": false}'),
    saveConfig: (data) => localStorage.setItem('config', JSON.stringify(data)),
};

import axios from 'axios';

const BASE_URL = 'https://ophim1.com';

async function fetchData() {
    try {
        console.log('Fetching Categories...');
        const categories = await axios.get(`${BASE_URL}/v1/api/the-loai`);
        console.log('Categories:', JSON.stringify(categories.data, null, 2));
    } catch (error) {
        console.error('Error fetching categories:', error.message);
    }

    try {
        console.log('Fetching New Movies...');
        const newMovies = await axios.get(`${BASE_URL}/danh-sach/phim-moi-cap-nhat`);
        console.log('New Movies:', JSON.stringify(newMovies.data, null, 2));
    } catch (error) {
        console.error('Error fetching new movies:', error.message);
    }
}

fetchData();

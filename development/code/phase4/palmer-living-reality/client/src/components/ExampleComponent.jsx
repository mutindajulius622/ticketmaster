import api from '../api';

const ExampleComponent = () => {
  const fetchData = async () => {
    try {
      const response = await api.get('/api/endpoint');
      console.log(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Call fetchData in useEffect or event handler
};
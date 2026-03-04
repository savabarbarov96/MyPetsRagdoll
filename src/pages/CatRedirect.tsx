import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCatById } from '@/services/convexCatService';
import { Id } from "../../convex/_generated/dataModel";

const CatRedirect = () => {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();

  // Try to fetch the cat to see if it exists
  const cat = useCatById(catId as Id<"cats"> | undefined);

  useEffect(() => {
    if (catId) {
      // Check if cat exists
      if (cat) {
        // Redirect to breed-appropriate page with query parameters
        const basePath = cat.breed === 'british' ? '/british' : '/';
        navigate(`${basePath}?cat=${catId}&modal=pedigree`, { replace: true });
      } else if (cat === null) {
        // Cat doesn't exist, redirect to main page
        navigate('/', { replace: true });
      }
      // If cat is undefined (still loading), do nothing yet
    } else {
      // No catId provided, redirect to main page
      navigate('/', { replace: true });
    }
  }, [cat, catId, navigate]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Зарежда се...</p>
      </div>
    </div>
  );
};

export default CatRedirect;

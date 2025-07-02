import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });

  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageSubmit = async () => {
    if (files.length > 0 && files.length + formData.imageUrls.length <= 6) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(uploadToCloudinary(files[i]));
      }

      try {
        const urls = await Promise.all(promises);
        setFormData((prev) => ({
          ...prev,
          imageUrls: prev.imageUrls.concat(urls),
        }));
      } catch (err) {
        setImageUploadError('Image upload failed (2MB max per image)');
      } finally {
        setUploading(false);
      }
    } else {
      setImageUploadError('You can only upload up to 6 images per listing');
    }
  };

  const uploadToCloudinary = (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('cloud_name', cloudName);

      fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.secure_url) resolve(data.secure_url);
          else reject(new Error('Upload failed'));
        })
        .catch(reject);
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (id === 'sale' || id === 'rent') {
      setFormData((prev) => ({ ...prev, type: id }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [id]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.imageUrls.length < 1) return setError('Upload at least one image');
    if (+formData.regularPrice < +formData.discountPrice) {
      return setError('Discount price must be lower than regular price');
    }

    try {
      setLoading(true);
      const res = await fetch('/api/listing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userRef: currentUser._id }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message);
      } else {
        navigate(`/listing/${data._id}`);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className='p-3 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>Create a Listing</h1>
      <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-4'>
        {/* Left Form */}
        <div className='flex flex-col gap-4 flex-1'>
          {/* Inputs: Name, Description, Address */}
          <input type='text' id='name' placeholder='Name' className='border p-3 rounded-lg' maxLength='62' minLength='10' required onChange={handleChange} value={formData.name} />
          <textarea id='description' placeholder='Description' className='border p-3 rounded-lg' required onChange={handleChange} value={formData.description} />
          <input type='text' id='address' placeholder='Address' className='border p-3 rounded-lg' required onChange={handleChange} value={formData.address} />

          {/* Checkboxes */}
          <div className='flex gap-6 flex-wrap'>
            {['sale', 'rent', 'parking', 'furnished', 'offer'].map((option) => (
              <div key={option} className='flex gap-2'>
                <input type='checkbox' id={option} className='w-5' checked={formData[option] === true || formData.type === option} onChange={handleChange} />
                <span className='capitalize'>{option === 'sale' || option === 'rent' ? option === 'sale' ? 'Sell' : 'Rent' : option}</span>
              </div>
            ))}
          </div>

          {/* Numeric Inputs */}
          <div className='flex flex-wrap gap-6'>
            {[
              { id: 'bedrooms', label: 'Beds' },
              { id: 'bathrooms', label: 'Baths' },
              { id: 'regularPrice', label: 'Regular price', hint: formData.type === 'rent' ? '($ / month)' : '' },
            ].map(({ id, label, hint }) => (
              <div key={id} className='flex items-center gap-2'>
                <input type='number' id={id} min='1' required className='p-3 border border-gray-300 rounded-lg' onChange={handleChange} value={formData[id]} />
                <div className='flex flex-col items-center'>
                  <p>{label}</p>
                  {hint && <span className='text-xs'>{hint}</span>}
                </div>
              </div>
            ))}
            {formData.offer && (
              <div className='flex items-center gap-2'>
                <input type='number' id='discountPrice' min='0' required className='p-3 border border-gray-300 rounded-lg' onChange={handleChange} value={formData.discountPrice} />
                <div className='flex flex-col items-center'>
                  <p>Discounted price</p>
                  {formData.type === 'rent' && <span className='text-xs'>($ / month)</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Form: Image Upload */}
        <div className='flex flex-col flex-1 gap-4'>
          <p className='font-semibold'>
            Images: <span className='font-normal text-gray-600 ml-2'>First is the cover (max 6)</span>
          </p>
          <div className='flex gap-4'>
            <input onChange={(e) => setFiles(e.target.files)} className='p-3 border border-gray-300 rounded w-full' type='file' id='images' accept='image/*' multiple />
            <button type='button' disabled={uploading} onClick={handleImageSubmit} className='p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80'>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <p className='text-red-700 text-sm'>{imageUploadError && imageUploadError}</p>
          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div key={url} className='flex justify-between p-3 border items-center'>
                <img src={url} alt='listing' className='w-20 h-20 object-contain rounded-lg' />
                <button type='button' onClick={() => handleRemoveImage(index)} className='p-3 text-red-700 rounded-lg uppercase hover:opacity-75'>
                  Delete
                </button>
              </div>
            ))}
          <button type='submit' disabled={loading || uploading} className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80'>
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
          {error && <p className='text-red-700 text-sm'>{error}</p>}
        </div>
      </form>
    </main>
  );
}

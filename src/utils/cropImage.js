export default function getCroppedImg(imageSrc, pixelCrop) {
  const canvas = document.createElement("canvas");
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => {
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject("Canvas empty");
          return;
        }

        resolve(new File([blob], "profile.jpg", { type: "image/jpeg" }));
      }, "image/jpeg");
    };

    image.onerror = reject;
    image.crossOrigin = 'Anonymous';
    image.src = imageSrc;
  });
}

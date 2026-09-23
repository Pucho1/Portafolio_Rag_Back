/**
 * Calcula la similitud coseno entre dos vectores.
 * La similitud coseno es una medida de similitud entre dos vectores que calcula el coseno del ángulo entre ellos.
 * Se utiliza comúnmente en procesamiento de lenguaje natural y recuperación de información para medir la similitud entre documentos o palabras representadas como vectores.
 * @param vecA 
 * @param vecB 
 * @returns  Un valor entre -1 y 1 que indica la similitud entre los dos vectores. Un valor cercano a 1 indica alta similitud, mientras que un valor cercano a -1 indica baja similitud.
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {

	const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0); // Recorre ambos vectores multiplicando los valores que comparten el mismo índice ($A_i \times B_i$) y suma todos los resultados. Representa qué tanto apuntan en la misma dirección.

	const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0)); // Elevado al cuadrado y sumado para cada elemento del vector A

	const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0)); // Elevado al cuadrado y sumado para cada elemento del vector B

	return dotProduct / (magnitudeA * magnitudeB);
}



/**
 *  Calcula la similitud coseno entre dos vectores de manera optimizada.
 *  Esta versión optimizada realiza una sola pasada a través de los vectores para calcular el producto punto y las magnitudes, lo que mejora la eficiencia.
 *  La similitud coseno es una medida de similitud entre dos vectores que calcula el coseno del ángulo entre ellos.
 *  Se utiliza comúnmente en procesamiento de lenguaje natural y recuperación de información para medir la similitud entre documentos o palabras representadas como vectores.
 * @param vecA 
 * @param vecB 
 * @returns  Un valor entre -1 y 1 que indica la similitud entre los dos vectores. Un valor cercano a 1 indica alta similitud, mientras que un valor cercano a -1 indica baja similitud.
 */
export const cosineSimilarityOptimizado = (vecA: number[], vecB: number[]): number => {
  const len = vecA.length;

  if (len !== vecB.length) {
    throw new Error('Los vectores deben tener la misma longitud.');
  }

  let dotProduct = 0;
  let sumSqA = 0;
  let sumSqB = 0;

  // Una sola pasada para calcular los tres valores
  for (let i = 0; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];

    dotProduct += a * b;
    sumSqA += a * a;
    sumSqB += b * b;
  }

  // Previene divisiones por cero con vectores nulos ([0, 0, ...])
  if (sumSqA === 0 || sumSqB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(sumSqA) * Math.sqrt(sumSqB));
};


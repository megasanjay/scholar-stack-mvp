/** .
 * Prisma does not automatically update the parent when a child is updated.
 * This creates a problem when we want to sort the collections by last updated.
 * This function updates the collection's random field, which triggers a
 * collection update
 *
 * @param collectionid - The id of the collection to touch
 * @returns void
 *
 */
const touchCollection = async (collectionid: number) => {
  // generate a random number between 0 and 1000
  const random = Math.floor(Math.random() * 1000);

  try {
    // update the collection
    await prisma.collection.update({
      data: {
        randomInt: random,
      },
      where: { id: collectionid },
    });
  } catch (error) {
    // Do nothing
    console.error(error);
  }
};

export default touchCollection;

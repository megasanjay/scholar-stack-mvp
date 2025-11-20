import { defineStore } from "pinia";

export const useLinkStore = defineStore("link", () => {
  const links: Ref<LocalLinkType[]> = ref([]);

  const resetLinks = () => {
    links.value = [];
  };

  const setLinks = (inputLinks: LocalLinkType[]) => {
    // add origin key to links
    links.value = inputLinks.map((link) => {
      return {
        ...link,
        origin: "remote",
      };
    });
  };

  const getLink = (id: string) => {
    return links.value.find((link) => link.id === id);
  };

  const addLink = (link: LocalLinkType) => {
    links.value.push(link);
  };

  const updateLink = (link: LocalLinkType) => {
    const index = links.value.findIndex((l) => l.id === link.id);

    if (index === -1) {
      return;
    }

    links.value[index] = link;
  };

  return { addLink, getLink, links, resetLinks, setLinks, updateLink };
});

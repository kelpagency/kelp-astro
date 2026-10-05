export interface BlogAuthor {
  id?: number;
  name?: string;
  slug?: string;
}

export const TEAM_MEMBERS = {
  andrew: { authorId: 222, name: "Andrew Prouty", url: "/about/andrew/" },
  brandon: { authorId: 87, name: "Brandon Berlew", url: "/about/brandon/" },
  jude: { authorId: 913, name: "Jude House", url: "/about/jude/" },
  luke: { authorId: 2, name: "Luke Kenney", url: "/about/luke/" },
  stefen: { authorId: 1, name: "Stefen Phelps", url: "/about/stefen/" },
} as const;

const teamMembers = Object.entries(TEAM_MEMBERS);

export const getTeamMemberUrl = (author?: BlogAuthor) => {
  if (!author) return undefined;

  const normalizedName = author.name?.trim().toLowerCase();
  const match = teamMembers.find(
    ([slug, member]) =>
      member.authorId === author.id ||
      slug === author.slug ||
      member.name.toLowerCase() === normalizedName,
  );

  return match?.[1].url;
};

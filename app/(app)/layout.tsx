import { cookies } from "next/headers";
import Providers from "./Providers";
import TabTitleLayout from "./layout.client";

export default async function ProvidersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookiesStore = await cookies();
  const jwt = cookiesStore.get("jwt")?.value;
  return (
    <Providers jwt={jwt}>
      <TabTitleLayout>{children}</TabTitleLayout>
    </Providers>
  );
}

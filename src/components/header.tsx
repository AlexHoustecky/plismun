import Image from "next/image"
import { Heading, Center } from "@chakra-ui/react"

type HeaderProps =
  | {
      title?: undefined
      mainPage: true
    }
  | {
      title: string
      mainPage?: undefined
    }

export default ({ title, mainPage }: HeaderProps) => {
  return (
    <div style={{ zIndex: -1, paddingBottom: mainPage ? "14vh" : "24vh" }}>
      <div
        className="bgWrap"
        style={{
          zIndex: -1,
          height: mainPage ? "70vh" : "40vh",
        }}
      >
        <Image
          src={
            mainPage
              ? "/images/school_img2.jpg"
              : "/images/school_imgheader.jpg"
          }
          layout="fill"
          objectFit="cover"
          className="backgroundImage"
        />
      </div>
      <Center paddingTop="16vh" flexDir="column">
        {mainPage ? (
          <>
            <Image src="/images/logolarge.png" height={350} width={350} />
            <Heading color="white">JANUARY 26TH - 29RD, 2023</Heading>
          </>
        ) : (
          <Heading color="white">{title}</Heading>
        )}
      </Center>
    </div>
  )
}

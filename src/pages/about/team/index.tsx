import {
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Image,
  Text,
} from "@chakra-ui/react"
import { StaffMember } from "@prisma/client"
import { db } from "@/utils/db"
import Link from "next/link"

const StaffMember = (data: StaffMember) => {
  return (
    <GridItem>
      <Link href={`/about/team/${data.id}`}>
        <Flex direction="column">
          <Image src={data.image} borderRadius="full" boxSize={300} />
          <Heading>{data.name}</Heading>
          <Text maxW={250}>{data.position}</Text>
        </Flex>
      </Link>
    </GridItem>
  )
}

type AboutUsProps = {
  people: StaffMember[]
}

function AboutUsPage({ people }: AboutUsProps) {
  return (
    <Container maxW="110ch">
      <Flex justify="center">
        <Grid
          templateRows="repeat(1, 1fr)"
          templateColumns="repeat(3, 1fr)"
          gap={4}
          justifyContent="center"
          flexWrap="wrap"
          display="flex"
        >
          {people.map((person, i) => (
            <StaffMember key={i} {...person} />
          ))}
        </Grid>
      </Flex>
    </Container>
  )
}

AboutUsPage.pageName = "ABOUT US"
export default AboutUsPage

export async function getStaticProps() {
  const team = await db.staffMember.findMany()
  return {
    props: {
      people: team,
    } as AboutUsProps,
  }
}
